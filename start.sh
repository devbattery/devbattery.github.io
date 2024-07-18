#!/bin/bash

echo "Removing _site directory..."
rm -rf _site

echo "Cleaning Jekyll cache..."
bundle exec jekyll clean

echo "Updating bundle..."
bundle update

echo "Starting Jekyll server..."
bundle exec jekyll serve
