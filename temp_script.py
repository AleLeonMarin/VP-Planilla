text='ahsn haez wwvu fshl'
import string
alpha=string.ascii_lowercase
for shift in range(26):
    res=''
    for ch in text:
        if ch in alpha:
            res+=alpha[(alpha.index(ch)+shift)%26]
        else:
            res+=ch
    print(shift,res)
