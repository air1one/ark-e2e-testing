echo "Starting ark" >> output.log
ls -l ./ >> output.log
ls packages/core/lib >> output.log
node --version >> output.log
ARK_LOG_FILE=ark.log packages/core/bin/ark start --config packages/core/lib/config/e2enet --network e2enet >> output.log 2> errors.log
echo "Started ark" >> output.log