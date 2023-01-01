netstat -ano | findstr :3306
netstat -ano | findstr :3000
taskkill /PID 15660 /F
taskkill /PID 12012 /F
net start mysql
pause
