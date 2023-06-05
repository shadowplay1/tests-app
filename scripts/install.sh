#!/bin/bash

echo "[1/2] Installing Node.js..."
echo

if ! command -v node &> /dev/null; then
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "[2/2] Installing dependencies..."
echo

npm i
npx husky install

cp ./.env.example ./.env

echo "Done!"
echo "Now fill in all the fields in the new '.env' file."

echo

echo "Run 'scripts/start.sh' to launch the development server."
read -p "Press Enter to exit the script."
