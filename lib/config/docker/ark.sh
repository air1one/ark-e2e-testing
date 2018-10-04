echo "Starting ark --network-start" >> output.log
cd packages/core
ls -l ./ >> ../../output.log
ls -l ./bin >> ../../output.log
./bin/ark start --config lib/config/e2enet --network e2enet >> ../../output.log
echo "Started ark --network-start" >> ../../output.log
cd ../..