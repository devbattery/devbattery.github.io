#!/bin/bash

set -euo pipefail

export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"

echo "Using Ruby: $(ruby -v)"
echo "Using Bundler: $(bundle version)"

echo "Ensuring bundle is installed..."
bundle check >/dev/null 2>&1 || bundle install

echo "Removing _site directory..."
rm -rf _site

echo "Cleaning Jekyll cache..."
bundle exec jekyll clean

echo "Starting Jekyll server..."
bundle exec jekyll serve
