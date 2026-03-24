@echo off
start /b python main.py
cd pos-frontend
start /b npm run dev
timeout /t 5
start http://localhost:5173