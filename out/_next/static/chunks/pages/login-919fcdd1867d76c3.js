(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[459],{2070:function(e,o,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/login",function(){return t(1072)}])},3143:function(e,o){"use strict";o.Z={src:"/_next/static/media/logo-INACAR.616e2a5b.png",height:100,width:200,blurDataURL:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAMAAACEE47CAAAAIVBMVEX///////////////////////////////////////////9/gMdvAAAAC3RSTlMBPRXJlk4o+GSq3j9RkU4AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAmSURBVHicJcY5AgAgCAOwHhTQ/z/YwUxBTlUDwJbvD2eoFkI7lB4I9AB05byRswAAAABJRU5ErkJggg==",blurWidth:8,blurHeight:4}},1072:function(e,o,t){"use strict";t.r(o),t.d(o,{default:function(){return p}});var n=t(5893),r=t(256),a=t(7294),i={backgroundColor:"#FF8000",color:"white","&:hover":{backgroundColor:"#e67300"},width:400};t(6501);var s=t(6195),l=e=>{let{name:o,value:t,onChange:r,children:a,onKeyDown:i}=e;return(0,n.jsx)(s.Z,{id:o,name:o,label:a,variant:"standard",value:t,onChange:r,onKeyDown:i,InputProps:{style:{color:"white"}},InputLabelProps:{style:{color:"white"}},sx:{"& .MuiInput-underline:before":{borderBottomColor:"white"},"& .MuiInput-underline:after":{borderBottomColor:"white"},"& .MuiInputBase-input":{color:"white"},"& .MuiInputLabel-root":{color:"white"},width:400,marginBottom:6}})},u=e=>{let{name:o,value:t,onChange:r,children:a,onKeyDown:i}=e;return(0,n.jsx)(s.Z,{id:o,name:o,label:a,variant:"standard",type:"password",value:t,onChange:r,onKeyDown:i,InputProps:{style:{color:"white"}},InputLabelProps:{style:{color:"white"}},sx:{"& .MuiInput-underline:before":{borderBottomColor:"white"},"& .MuiInput-underline:after":{borderBottomColor:"white"},"& .MuiInputBase-input":{color:"white"},"& .MuiInputLabel-root":{color:"white"},width:400,marginBottom:6}})},c=t(3143),d=t(5675),h=t.n(d),A=t(1163),p=()=>{let[e,o]=(0,a.useState)({username:"",password:""}),[t,s]=(0,a.useState)(""),[d,p]=(0,a.useState)(!1),w=(0,A.useRouter)(),g=e=>{let{name:t,value:n}=e.target;o(e=>({...e,[t]:n}))},m=async()=>{p(!0),s("");try{let o=await fetch("http://localhost:8000/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!o.ok){let e=await o.json();console.error("Login error:",e.message),s(e.message||"Error desconocido.");return}let t=await o.json();localStorage.setItem("first_name",t.first_name),localStorage.setItem("last_name",t.last_name),localStorage.setItem("token",t.token),"admin"===t.userType?w.push("/inicio"):"user"===t.userType?w.push("/control"):s("Tipo de usuario desconocido.")}catch(e){s("\xa1Hubo un error! Por favor, int\xe9ntalo de nuevo.")}finally{p(!1)}},b=e=>{"Enter"===e.key&&(e.preventDefault(),m())};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:"background"}),(0,n.jsxs)("div",{className:"login-container",children:[(0,n.jsx)(h(),{src:c.Z,height:80,width:160,alt:"Inacar Logo",priority:!0}),(0,n.jsx)(l,{name:"username",value:e.username,onChange:g,onKeyDown:b,children:"Username"}),(0,n.jsx)(u,{name:"password",value:e.password,onChange:g,onKeyDown:b,children:"Password"}),(0,n.jsx)(r.Z,{onClick:m,variant:"contained",disabled:d,sx:i,children:d?"Iniciando...":"Iniciar Sesion"}),t&&(0,n.jsx)("p",{className:"error-message",children:t})]})]})}},6501:function(){}},function(e){e.O(0,[319,195,888,774,179],function(){return e(e.s=2070)}),_N_E=e.O()}]);