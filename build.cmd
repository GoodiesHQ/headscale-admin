@echo off

set VERSION=%~1

if "%VERSION%" == "" if [%VERSION%] == [] goto fail

set VERSIONPATH="%CD%\build\v%VERSION%"

REM build and run the container
REM docker build --build-arg ENDPOINT=/admin -t goodieshq/headscale-admin:%VERSION% .
docker buildx build --platform linux/amd64,linux/arm64 --build-arg ENDPOINT=/admin -t goodieshq/headscale-admin:%VERSION% .
docker run -d -v %VERSIONPATH%:/mnt --name headscale-tmp -it goodieshq/headscale-admin:%VERSION%

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
echo "Usage: %~0 <version to build>"