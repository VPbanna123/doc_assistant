
import { resend } from "./resend";


 const sendVerificationemail=async(email,username,token)=>{
    try {
        const confirmlink=`${process.env.URl}/verify-email?token=${token}`
        if(email)
        {
            console.log("email is senderverfication ",email)

        }else{
            console.log("email is not came in sendverificationemail")
        }

        const result=await resend.emails.send({
           from:"onboarding@resend.dev",
           to:email,
           subject:"verifiy your email",
           html:
        `
        <h1>Welcome to AAI 👋</h2>
        <h2>HI ${username} 👋</h2>
        <p>Please click the link below to verify your email:</p>
        <a href="${confirmlink}">Verify Email</a>
        <p>This link will expire in 15 minutes.</p>
        `
        })
         console.log("📧 Resend response:", result);
        return true;
    } catch (error) {
        console.error("error in sending email",error)
        return false;
    }
}

export default sendVerificationemail