netstat -ano | findstr :3306
netstat -ano | findstr :3000
taskkill /PID 5708 /F
taskkill /PID 5196 /F
net start mysql
pause
