use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use url::Url;

/// 只允许留在应用自身页面；外链导航一律取消（由前端 openUrl 打开系统浏览器）。
fn allow_navigation(url: &Url) -> bool {
    match url.scheme() {
        "tauri" | "asset" | "blob" | "data" | "ipc" | "about" => true,
        "http" | "https" => matches!(
            url.host_str(),
            Some("localhost" | "127.0.0.1" | "tauri.localhost")
        ),
        _ => false,
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("navigation-guard")
        .on_navigation(|_webview, url| allow_navigation(url))
        .build()
}

#[cfg(test)]
mod tests {
    use super::allow_navigation;
    use url::Url;

    #[test]
    fn allows_app_origins() {
        assert!(allow_navigation(
            &Url::parse("http://localhost:1420/").unwrap()
        ));
        assert!(allow_navigation(
            &Url::parse("https://tauri.localhost/").unwrap()
        ));
        assert!(allow_navigation(&Url::parse("tauri://localhost/").unwrap()));
    }

    #[test]
    fn blocks_external_https() {
        assert!(!allow_navigation(
            &Url::parse("https://example.com/path").unwrap()
        ));
    }
}
