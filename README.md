# 🧵 Thread CPU Usage Analyzer

A web-based tool to analyze Java thread dumps and correlate per-thread CPU usage from system thread usage reports.

Built with Node.js + Express + HTML5, this app helps you:
- Upload a thread usage file and a thread dump file
- Automatically match TID (decimal) with nid (hexadecimal)
- Display CPU usage, thread name, and JVM TID
- Quickly identify the most CPU-intensive threads in a visual table

---

## 🚀 Getting Started

1. Clone the Project
```
git clone https://github.com/your-username/thread-cpu-analyzer.git
cd thread-cpu-analyzer
```
2. Install Dependencies
```
npm install
```
3. Start the Server
```
npm start
```
Then open your browser at:

http://localhost:3000

---

## 📂 Upload File Format

✅ Thread Usage File (e.g., thread_usage_2025-04-29-22:25:37.txt)

Example format:

 PID     TID %CPU     TIME NLWP  C
  50      53  0.9 00:07:41  529  0

✅ Thread Dump File (e.g., thread_dump_2025-04-29-22:25:37.txt)

Java thread dump with lines like:

"Thread-1" #10 prio=5 tid=0x00007f8d1c015000 nid=0x35 runnable
