@echo off

set VERSION=%~1

if "%VERSION%" == "" if [%VERSION%] == [] goto fail

set VERSIONPATH="%CD%\v%VERSION%"

REM build and run the container
docker run --rm -d -v %VERSIONPATH%:/mnt --name headscale-tmp -it goodieshq/headscale-admin:%VERSION% /bin/cp -r /app/admin /mnt

mkdir %VERSIONPATH%

REM create the .tar.gz, .zip, and .7z files
7z.exe a -ttar "%VERSIONPATH%\admin.tar" "%VERSIONPATH%\admin\*"
7z.exe a -tgzip -mx=9 "%VERSIONPATH%\admin.tar.gz" "%VERSIONPATH%\admin.tar"
del %VERSIONPATH%\admin.tar
7z.exe a -tzip -mx=9 "%VERSIONPATH%\admin.zip" "%VERSIONPATH%\admin\*"
7z.exe a -tzip -mx=9 "%VERSIONPATH%\admin.zip" "%VERSIONPATH%\admin\*"
7z.exe a -t7z -mx=9 "%VERSIONPATH%\admin.7z" "%VERSIONPATH%\admin\*"
exit

:fail
echo "Usage: %~0 <version to build>"