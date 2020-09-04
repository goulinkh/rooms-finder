#!/bin/bash
if [ -z "$ENV"]; then
  ENV=$(grep ENV .env | xargs)
  IFS='=' read -ra ENV <<<"$ENV"
  ENV=${ENV[1]}
fi

if [ "$ENV" == "prod" ]; then
  docker-compose -f docker-compose.override.yml -f docker-compose.prod.yml "$@"
else
  # default: dev
  docker-compose "$@"
fi