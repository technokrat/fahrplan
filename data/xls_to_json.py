import sys

import pandas as pd

f = open('HST201707V30.csv')
cnt = 0

for l in f:
	cnt += 1
	if cnt > 20:
		break
	print(l)

df = pd.read_csv('HST201707V30.csv')

print(df)