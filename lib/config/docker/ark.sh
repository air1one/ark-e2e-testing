echo "Starting ark" >> output.log
ls -l ./ >> output.log
node --version >> output.log
node ark.js >> output.log 2> errors.log
echo "Started ark" >> output.log