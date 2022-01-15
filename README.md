###### Bank Api
###############

This is the first weekend project that exercizes my node.js skills.
In the project im building a "mock" bank api of an admin user.
The user is able to CRUD all the bank's clients. all requests are handled on server-side.
######
Server side used with express. All requests are GET or POST (will explain below).
Also there is a modest UI built with handlebars (hbs). as of this lines im struggling with serving the hbs files with separate css. 
When it was just the one file I tried putting the css in 'public' folder and approaching it as a static file. 
After more hbs files were added to the mix something went wrong and i couldnt figure out what.
hopefully i'll get it at some point :) 
in the meantime im styling with <style> tags in each hbs file which doesnt feel like best practice, but at least the nav bar have some colors.
##### 
Alright I figured out the styling bug! had to add public directory and serve it as static. Also had to put css
files on /css directory in order to fetch them. it looks great now :D 
