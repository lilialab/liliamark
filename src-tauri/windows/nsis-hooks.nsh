; Tauri NSIS file associations omit quotes around $INSTDIR\exe, so paths with
; spaces (e.g. C:\Users\Liu Yuchuan\...) truncate to "Liu" in Open With.
; Deep-link registration in the same template already quotes the exe; mirror that.

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr SHCTX "Software\Classes\LiliaMark.Markdown\DefaultIcon" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr SHCTX "Software\Classes\LiliaMark.Markdown\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
!macroend
