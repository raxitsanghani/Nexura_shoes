
import { getFirestore, collection, addDoc } from "firebase/firestore";

export const sendOrderConfirmationEmail = async (email: string, orderData: any) => {
    if (!email) return;
    const db = getFirestore();

    try {
        await addDoc(collection(db, "mail"), {
            to: email,
            message: {
                subject: `Order Confirmation - ${orderData.orderId}`,
                html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #000;">Thank you for your order!</h1>
            <p>Hi ${orderData.address?.name || 'Customer'},</p>
            <p>Your order <strong>${orderData.orderId}</strong> has been successfully placed.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${orderData.price?.toFixed(2)}</td>
              </tr>
              <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${orderData.paymentMethod.toUpperCase()}</td>
              </tr>
            </table>

            <p>You can track your order status on our website.</p>
            <p>Best Regards,<br/>Nexura Sports Team</p>
          </div>
        `,
            }
        });
        console.log("Email queued for delivery");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
