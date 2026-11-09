use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime};

use notify_debouncer_full::notify::event::ModifyKind;
use notify_debouncer_full::notify::{EventKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

const DEBOUNCE: Duration = Duration::from_millis(200);

const EVENT_NAME: &str = "disk-file-changed";

/// 发给前端的变更类型。序列化后是 `"modify"` 或 `"remove"`。
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum DiskChangeKind {
    Modify,
    Remove,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskFileChangedPayload {
    pub path: String,
    pub kind: DiskChangeKind,
}

#[derive(Clone, Copy, PartialEq)]
struct FileFingerprint {
    modified: SystemTime,
    len: u64,
}

struct WatchShared {
    /// Frontend path strings we care about (display / match key).
    files: HashSet<PathBuf>,
    /// 正在由本应用写入的路径，期间忽略全部监视事件。
    self_writing: HashSet<PathBuf>,
    /// 本应用刚写入后的 mtime + size，用于忽略自保存回声。
    last_self_write: HashMap<PathBuf, FileFingerprint>,
}

pub struct FileWatchState {
    shared: Arc<Mutex<WatchShared>>,
    debouncer: Mutex<Option<Debouncer<RecommendedWatcher, RecommendedCache>>>,
    watched_dirs: Mutex<HashSet<PathBuf>>,
}

impl FileWatchState {
    pub fn new() -> Self {
        Self {
            shared: Arc::new(Mutex::new(WatchShared {
                files: HashSet::new(),
                self_writing: HashSet::new(),
                last_self_write: HashMap::new(),
            })),
            debouncer: Mutex::new(None),
            watched_dirs: Mutex::new(HashSet::new()),
        }
    }

    pub fn begin_self_write(&self, path: &str) {
        let key = normalize_path(Path::new(path));
        if let Ok(mut shared) = self.shared.lock() {
            shared.self_writing.insert(key);
        }
    }

    /// 结束自写：移出 self_writing；若文件仍在则记下指纹挡回声。
    pub fn end_self_write(&self, path: &str) {
        let key = normalize_path(Path::new(path));
        if let Ok(mut shared) = self.shared.lock() {
            shared.self_writing.remove(&key);
            if let Some(fingerprint) = file_fingerprint(&key) {
                shared.last_self_write.insert(key, fingerprint);
            }
        }
    }
}

/// 按当前平台规则收路径（分隔符、`.` 等），不把 `/` 强行改成 `\`。
fn normalize_path(path: &Path) -> PathBuf {
    path.components().collect()
}

fn file_fingerprint(path: &Path) -> Option<FileFingerprint> {
    let meta = fs::metadata(path).ok()?;
    Some(FileFingerprint {
        modified: meta.modified().ok()?,
        len: meta.len(),
    })
}

fn paths_match(a: &Path, b: &Path) -> bool {
    let left = normalize_path(a);
    let right = normalize_path(b);
    #[cfg(windows)]
    {
        left.to_string_lossy()
            .eq_ignore_ascii_case(&right.to_string_lossy())
    }
    #[cfg(not(windows))]
    {
        left == right
    }
}

fn set_contains_path(set: &HashSet<PathBuf>, path: &Path) -> bool {
    set.iter().any(|entry| paths_match(entry, path))
}

/// 操作系统事件收成「正文变了」或「文件没了」。
/// 忽略元数据（xattr / Finder / Spotlight 等）与纯 rename。
fn classify_event(kind: EventKind) -> Option<DiskChangeKind> {
    match kind {
        EventKind::Remove(_) => Some(DiskChangeKind::Remove),
        // 原子替换：删旧建新 / 直接落在监听路径上
        EventKind::Create(_) => Some(DiskChangeKind::Modify),
        EventKind::Modify(ModifyKind::Data(_)) => Some(DiskChangeKind::Modify),
        // Windows：内容写入只报到 Modify(Any)
        EventKind::Modify(ModifyKind::Any) => Some(DiskChangeKind::Modify),
        _ => None,
    }
}

/// 事件路径若对应某个已打开文件，返回那条路径。
fn opened_file<'a>(files: &'a HashSet<PathBuf>, event_path: &Path) -> Option<&'a PathBuf> {
    files.iter().find(|watched| paths_match(watched, event_path))
}

/// 决定要不要通知前端。
/// 自己刚保存的文件（mtime + size 相同）返回 None。
/// 本来是修改、但文件已经读不到，改报删除。
fn kind_to_emit(
    kind: DiskChangeKind,
    path: &Path,
    last_self_write: &HashMap<PathBuf, FileFingerprint>,
) -> Option<DiskChangeKind> {
    if kind != DiskChangeKind::Modify {
        return Some(kind);
    }

    match file_fingerprint(path) {
        None => Some(DiskChangeKind::Remove),
        Some(fingerprint) if last_self_write.get(path) == Some(&fingerprint) => None,
        Some(_) => Some(DiskChangeKind::Modify),
    }
}

fn ensure_debouncer(app: &AppHandle, state: &FileWatchState) -> Result<(), String> {
    let mut slot = state.debouncer.lock().map_err(|e| e.to_string())?;
    if slot.is_some() {
        return Ok(());
    }

    let shared = Arc::clone(&state.shared);
    let app_handle = app.clone();

    let debouncer = new_debouncer(
        DEBOUNCE,
        None,
        move |result: DebounceEventResult| {
            let Ok(events) = result else {
                return;
            };

            let payloads = {
                let Ok(shared) = shared.lock() else {
                    return;
                };

                let mut emitted: HashSet<(String, DiskChangeKind)> = HashSet::new();
                let mut payloads = Vec::new();

                for event in events {
                    let Some(event_kind) = classify_event(event.kind) else {
                        continue;
                    };

                    for event_path in &event.paths {
                        let Some(watched) = opened_file(&shared.files, event_path).cloned() else {
                            continue;
                        };
                        if set_contains_path(&shared.self_writing, &watched) {
                            continue;
                        }
                        let Some(emit_kind) =
                            kind_to_emit(event_kind, &watched, &shared.last_self_write)
                        else {
                            continue;
                        };

                        let path = watched.to_string_lossy().into_owned();
                        if !emitted.insert((path.clone(), emit_kind)) {
                            continue;
                        }
                        payloads.push(DiskFileChangedPayload {
                            path,
                            kind: emit_kind,
                        });
                    }
                }

                payloads
            };

            for payload in payloads {
                let _ = app_handle.emit(EVENT_NAME, payload);
            }
        },
    )
    .map_err(|e| e.to_string())?;

    *slot = Some(debouncer);
    Ok(())
}

/// 同步当前应监听的文件列表（开 tab 加入、关 tab 移除）。
#[tauri::command]
pub(crate) fn sync_watched_files(
    app: AppHandle,
    state: State<'_, FileWatchState>,
    paths: Vec<String>,
) -> Result<(), String> {
    ensure_debouncer(&app, &state)?;

    let next_files: HashSet<PathBuf> = paths
        .into_iter()
        .map(|p| normalize_path(Path::new(&p)))
        .collect();

    let next_dirs: HashSet<PathBuf> = next_files
        .iter()
        .filter_map(|file| file.parent().map(normalize_path))
        .collect();

    {
        let mut shared = state.shared.lock().map_err(|e| e.to_string())?;
        shared
            .last_self_write
            .retain(|path, _| next_files.contains(path));
        shared
            .self_writing
            .retain(|path| next_files.contains(path));
        shared.files = next_files;
    }

    let mut debouncer = state.debouncer.lock().map_err(|e| e.to_string())?;
    let debouncer = debouncer
        .as_mut()
        .ok_or_else(|| "file watcher not initialized".to_string())?;

    let mut watched_dirs = state.watched_dirs.lock().map_err(|e| e.to_string())?;

    let to_unwatch: Vec<PathBuf> = watched_dirs
        .difference(&next_dirs)
        .cloned()
        .collect();
    for dir in to_unwatch {
        let _ = debouncer.unwatch(&dir);
        watched_dirs.remove(&dir);
    }

    let to_watch: Vec<PathBuf> = next_dirs.difference(&watched_dirs).cloned().collect();
    for dir in to_watch {
        if !dir.exists() {
            continue;
        }
        debouncer
            .watch(&dir, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
        watched_dirs.insert(dir);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use notify_debouncer_full::notify::event::{
        CreateKind, DataChange, MetadataKind, RemoveKind, RenameMode,
    };

    #[test]
    fn classify_keeps_content_and_remove() {
        assert_eq!(
            classify_event(EventKind::Modify(ModifyKind::Data(DataChange::Content))),
            Some(DiskChangeKind::Modify)
        );
        assert_eq!(
            classify_event(EventKind::Modify(ModifyKind::Any)),
            Some(DiskChangeKind::Modify)
        );
        assert_eq!(
            classify_event(EventKind::Create(CreateKind::File)),
            Some(DiskChangeKind::Modify)
        );
        assert_eq!(
            classify_event(EventKind::Remove(RemoveKind::File)),
            Some(DiskChangeKind::Remove)
        );
    }

    #[test]
    fn classify_ignores_metadata_and_rename() {
        assert_eq!(
            classify_event(EventKind::Modify(ModifyKind::Metadata(MetadataKind::Extended))),
            None
        );
        assert_eq!(
            classify_event(EventKind::Modify(ModifyKind::Name(RenameMode::Any))),
            None
        );
        assert_eq!(classify_event(EventKind::Any), None);
    }
}
