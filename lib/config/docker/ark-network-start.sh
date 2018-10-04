echo "Starting ark --network-start" >> output.log
ls -l ./ >> output.log
node --version >> output.log
node ark.js >> output.log 2> errors.log
echo "Started ark --network-start" >> output.log