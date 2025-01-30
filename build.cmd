@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Check if at least one parameter is provided
if "%~1"=="" (
    echo Usage: %~nx0 [version1] [version2] [version3] ...
    goto fail
)

REM Initialize variables
set "VERSION1=%~1"
set "VERSIONPATH=%CD%\build\v%VERSION1%"

REM Initialize the tags variable
set "TAGS="

REM Iterate over all provided parameters
:loop
if "%~1"=="" goto after_loop
    set "TAGS=!TAGS! -t goodieshq/headscale-admin:%~1"
    shift
    goto loop
:after_loop

REM build and run the container
docker buildx build --platform linux/amd64,linux/arm64 --build-arg ENDPOINT=/admin !TAGS! --push .
docker run -d -v %VERSIONPATH%:/mnt --name headscale-tmp -it goodieshq/headscale-admin:%VERSION1%

REM copy the build directory
docker exec -it headscale-tmp /bin/sh -c "cp -r /app/admin /mnt/"
docker container kill headscale-tmp
docker container rm headscale-tmp

REM create the .tar.gz, .zip, and .7z files
7z.exe a -ttar "%VERSIONPATH%\admin.tar" "%VERSIONPATH%\admin\*"
7z.exe a -tgzip -mx=9 "%VERSIONPATH%\admin.tar.gz" "%VERSIONPATH%\admin.tar"
del %VERSIONPATH%\admin.tar
7z.exe a -tzip -mx=9 "%VERSIONPATH%\admin.zip" "%VERSIONPATH%\admin\*"
7z.exe a -tzip -mx=9 "%VERSIONPATH%\admin.zip" "%VERSIONPATH%\admin\*"
7z.exe a -t7z -mx=9 "%VERSIONPATH%\admin.7z" "%VERSIONPATH%\admin\*"
exit

:fail
echo Error: At least one version parameter is required.
exit /b 1

:end
ENDLOCAL