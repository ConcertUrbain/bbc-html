echo "Zipping sources"
mkdir build
zip -r build/application.zip . -x *.git* build\*

echo "Deploy $TRAVIS_TAG version to S3"
aws s3 cp infra/bbc.cfn.yml s3://chatanoo-deployments-eu-west-1/infra/front/bbc/$TRAVIS_TAG.cfn.yml
aws s3 cp build/application.zip s3://chatanoo-deployments-eu-west-1/front/bbc/$TRAVIS_TAG.zip

echo "Upload latest"
aws s3api put-object \
  --bucket chatanoo-deployments-eu-west-1 \
  --key infra/front/bbc/latest.cfn.yml \
  --website-redirect-location /infra/front/bbc/$TRAVIS_TAG.cfn.yml
aws s3api put-object \
  --bucket chatanoo-deployments-eu-west-1 \
  --key front/bbc/latest.zip \
  --website-redirect-location /front/bbc/$TRAVIS_TAG.zip
