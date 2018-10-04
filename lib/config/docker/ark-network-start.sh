echo "Starting ark --network-start" >> output.log
packages/core/bin/ark start --config packages/core/lib/config/e2enet --network e2enet --network-start >> output.log
echo "Started ark --network-start" >> output.log