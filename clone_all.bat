@echo off
REM Script to clone all Automa Ecosystem repositories on Windows

echo Cloning Automa Ecosystem repositories...

gh repo clone tuquet/automa automa
gh repo clone tuquet/automa-be automa-be
gh repo clone tuquet/automa-cli automa-cli

echo All repositories cloned successfully!
pause
