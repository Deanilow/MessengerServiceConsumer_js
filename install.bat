@echo off

REM Obtener la ruta del script actual
set "scriptPath=%~dp0"

REM Construir la ruta del archivo .env
set "envFilePath=%scriptPath%.env"

REM Leer el valor de "DEFAULT_NAME_WORKER" del archivo .env
for /f "tokens=2 delims==," %%a in ('type "%envFilePath%" ^| find /i "DEFAULT_NAME_WORKER"') do set "name=%%~a"
set "name=%name:"=%"
set "name=%name: =%"

REM Verificar si el archivo JSON existe y eliminarlo si es el caso
if exist "%scriptPath%%name%.json" (
  del "%scriptPath%%name%.json"
  echo Archivo JSON existente eliminado.
)

REM Leer el valor de "INSTANCES" del archivo .env
for /f "tokens=2 delims==," %%b in ('type "%envFilePath%" ^| find /i "INSTANCES"') do set "instances=%%~b"
set "instances=%instances:"=%"
set "instances=%instances: =%"

REM Construir las rutas con doble barra invertida
set "scriptFilePath=%scriptPath%src\server.js"
set "scriptFilePath=%scriptFilePath:\=\\%"
set "cwd=%scriptPath%"
set "cwd=%cwd:\=\\%"
if "%cwd:~-2%"=="\\" set "cwd=%cwd:~0,-2%"

REM Contenido del JSON
(
  echo {
  echo   "apps": [
  echo     {
  echo       "name": "%name%",
  echo       "script": "%scriptFilePath%",
  echo       "cwd": "%cwd%",
  echo       "instances": %instances%, 
  echo       "exec_mode": "cluster",
  echo       "max_memory_restart": "2G",
  echo       "log_date_formato": "MM-DD--YYYY HH:mm Z",
  echo       "max_restarts": 5,
  echo       "autorestart": true
  echo     }
  echo   ]
  echo }
) > "%scriptPath%%name%.json"

echo JSON creado exitosamente.

REM Esperar 2 segundos
timeout /t 2 /nobreak > NUL

REM Ejecutar el comando pm2 start %name%.json
pm2 start "%scriptPath%%name%.json"
