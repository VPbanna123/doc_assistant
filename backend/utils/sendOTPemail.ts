import { resend } from "./resend";

const sendOTPemail=async(email,username,token)=>{

try {
    
    if(email)
    {
        console.log("email in sendOtpemail is",email);
    }
    else{
        console.log("email is not came in sendotpemail")
    }

    const result=await resend.emails.send({
       from:"onboarding@resend.dev",
       to:email,
       subject:"your otp for AAI login",
       html:
       `
       <h1>Welcome to AAI 👋</h2>
        <h2>HI ${username} 👋</h2>
        <p>your verify code for AAI forget password is:</p>
        <h2> ${token} </h2>
      <br>
      <br>
        <p>This code will expire in 1 minutes.</p>
       `
    })
    console.log("Resend response",result);
    return true;
} catch (error) {
    console.error("error in sending email",error)
    return false;
}

}
export default sendOTPemail