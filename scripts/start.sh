#!/bin/bash

echo "Starting dev server..."
npx next dev &

pid=$!
wait "$pid"

exit_code=$?

read -p "Process exited with code $exit_code. Press Enter to exit the script."
