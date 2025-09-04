message = "hello woRld"
print(message)
msg = message+"123"
print(msg)
print("title:", message.title())
print("upper:", message.upper())
print("lower:", message.lower())

first_name = "wang"
last_name = "xi"
full_name = first_name+" "+last_name
full_name2 = f"{first_name} {last_name}"
print(full_name)
print(full_name2)

empty_str = " 123 4 "
print(empty_str.rstrip()+"l")
print(empty_str.lstrip()+"l")
print(empty_str.strip()+"l")


name = "Hello eric"
str = ", would you like to learn some Python today?"
print(name+str)
print(name.title()+str)
print(name.lower()+str)
print(name.upper()+str)

h = "http://1.1.1.1.com"
print(h.removeprefix("http://"))
print(h.removesuffix(".com"))
