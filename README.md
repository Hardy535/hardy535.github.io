Frontend for <a href="https://github.com/Palakis/obs-websocket">obs-websocket</a> (Scenes, Sources and Transitions)<br/><br/>
<b>So far there is a problem when trying to connect due to the forced HTTPS connection from github.io!</b><br/>
<b>To fix this, please allow the http connection in your browser when trying to connect to get a working remote connection.</b>

#http://hardy535.github.io/obs-remote

<b>Bugs</b>
- Names with special characters like 'Ä', 'Ö' or 'ß' don't work properly (Reported: https://github.com/haganbmj/obs-websocket-js/issues/6)
- HTTPS connections to local ip's don't work without users confirmation (which is impossible on some devices) (Reported: https://github.com/Palakis/obs-websocket/issues/26)
- OBS crashes sometimes (Reported: https://github.com/Palakis/obs-websocket/issues/21)
- Deleting, renaming or changing order of scenes doesn't trigger anything (Known: https://github.com/haganbmj/obs-websocket-js/issues/5)
- Changing the source visibility in OBS doesn't trigger anything

<b>ToDo</b>
- Mobile/Tablet versions (layout) for easier use
- Customisable layout (height/width and position)
- Customisable colors for everything
- Save the customisables somehow (maybe with cookies)
- Autologin via URL (?password=...)
- Keep this up to date ;)

<b>Fixed Bugs</b>
- Hiding/Showing Sources isn't working (Reported: https://github.com/haganbmj/obs-websocket-js/issues/7)
- Changes of the scene list in OBS don't sync (Reported: https://github.com/haganbmj/obs-websocket-js/issues/5)

<b>Thanks for fixing these bugs :)</b>
