Set shell = CreateObject("WScript.Shell")
Set fileSystem = CreateObject("Scripting.FileSystemObject")

root = fileSystem.GetParentFolderName(WScript.ScriptFullName)
serverScript = fileSystem.BuildPath(fileSystem.BuildPath(root, "tools"), "melodify-server.ps1")

command = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & serverScript & """ -Port 8788 -FixedPort"
shell.Run command, 0, False
