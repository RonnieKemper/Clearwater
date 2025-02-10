netstat -ano | findstr :3306
netstat -ano | findstr :3000
taskkill /PID 5708 /F
taskkill /PID 5196 /F
net start mysql
pause

on linux:
sudo netstat -ltnp | grep -w ':3306' 
sudo netstat -ano | grep -w ':3000' 
kill 3000
fuser -k 3000/tcp
sudo systemctl stop mysql
sudo systemctl start mysql



https://www.npmjs.com/package/nodemon start multiple express apps
use this line to start the admin version of express on port 3001, it works, you also have to change a line in app.js i think:
nodemon ./app.js localhost 8080