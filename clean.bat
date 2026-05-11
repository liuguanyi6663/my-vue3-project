@echo off
echo ========================================
echo Uni-app 项目清理脚本
echo ========================================
echo.

echo [1/4] 清理 client 目录缓存...
if exist "client\node_modules" (
    echo 删除 client\node_modules...
    rmdir /s /q "client\node_modules"
)
if exist "client\package-lock.json" (
    echo 删除 client\package-lock.json...
    del "client\package-lock.json"
)
if exist "client\unpackage" (
    echo 删除 client\unpackage...
    rmdir /s /q "client\unpackage"
)
if exist "client\dist" (
    echo 删除 client\dist...
    rmdir /s /q "client\dist"
)
if exist "client\.vite" (
    echo 删除 client\.vite...
    rmdir /s /q "client\.vite"
)

echo.
echo [2/4] 清理 server 目录缓存...
if exist "server\node_modules" (
    echo 删除 server\node_modules...
    rmdir /s /q "server\node_modules"
)
if exist "server\package-lock.json" (
    echo 删除 server\package-lock.json...
    del "server\package-lock.json"
)

echo.
echo [3/4] 清理根目录缓存...
if exist "node_modules" (
    echo 删除 node_modules...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    echo 删除 package-lock.json...
    del "package-lock.json"
)

echo.
echo ========================================
echo 清理完成！
echo ========================================
echo.
echo 接下来请按以下步骤操作：
echo 1. 运行: cd client ^&^& npm install
echo 2. 运行: cd ../server ^&^& npm install
echo 3. 在微信开发者工具中清除缓存
echo.
pause
