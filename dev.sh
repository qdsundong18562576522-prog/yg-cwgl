#!/bin/bash
# 扬光财务管理系统 - 开发环境启动/停止脚本
# 用法: ./dev.sh start|stop|restart

CWGL_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=12500
FRONTEND_PORT=12501

kill_port() {
  local port=$1
  local pid=$(netstat -ano | grep LISTENING | grep ":$port " | awk '{print $5}')
  if [ -n "$pid" ]; then
    taskkill //F //PID $pid 2>/dev/null
    echo "  Killed process on port $port (PID: $pid)"
  fi
}

case "${1:-start}" in
  stop)
    echo "Stopping yg-cwgl..."
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    echo "Done."
    ;;
  start)
    echo "Starting yg-cwgl..."
    # Backend
    cd "$CWGL_DIR/backend" || exit 1
    nohup node dist/src/main.js > /tmp/backend.log 2>&1 &
    echo "  Backend starting on http://localhost:$BACKEND_PORT"
    # Frontend
    cd "$CWGL_DIR/frontend" || exit 1
    nohup npx vite --host 0.0.0.0 --port $FRONTEND_PORT > /tmp/frontend.log 2>&1 &
    echo "  Frontend starting on http://localhost:$FRONTEND_PORT"
    echo "  Logs: /tmp/backend.log, /tmp/frontend.log"
    echo "Done."
    ;;
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac
