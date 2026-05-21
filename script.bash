rm -rf Jenkinsfile
cp /Users/huynhnhatlinh0305/Downloads/devsecops-factory/ci/Jenkinsfile ./ 
rm -rf ci/stages
cp -rf  /Users/huynhnhatlinh0305/Downloads/devsecops-factory/ci/stages ./ci/
echo "// new feature" >> app/src/App.js
git add . 
COMMIT_ID=$(cat counter.txt) 
git commit -m "version-$COMMIT_ID"
git push origin main 
NEW_VAL=$((COMMIT_ID+1))
echo $NEW_VAL > counter.txt
