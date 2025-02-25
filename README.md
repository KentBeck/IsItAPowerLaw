# IsItAPowerLaw

One page app to determine whether a distribution is power law distributed.

For example, in a Java repo, install PMD and run this command:

pmd-bin-7.7.0/bin/pmd check -R lines.xml -d . | awk -F'NCSS line count of ' '{print $2}' | sort -n | uniq -c | awk '{temp=$1; $1=$2; $2=temp; print}'

This will give you the histogram of lines per function.
