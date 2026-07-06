#!/bin/bash
# Script to clone all Automa Ecosystem repositories on Linux/Mac

echo "Cloning Automa Ecosystem repositories..."

gh repo clone tuquet/automa automa
cd automa && pnpm install --ignore-scripts && cd ..

gh repo clone tuquet/automa-be automa-be
cd automa-be && pnpm install --ignore-scripts && cd ..

gh repo clone tuquet/automa-cli automa-cli
cd automa-cli && pnpm install --ignore-scripts && cd ..

echo "All repositories cloned successfully!"
