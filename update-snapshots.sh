#!/bin/bash

# Script to update obsolete Jest snapshots for PairCoder project

echo "Updating obsolete Jest snapshots..."
npx jest --updateSnapshot

echo "Done!"
