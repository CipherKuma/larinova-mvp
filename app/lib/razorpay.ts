import Razorpay from "razorpay";

let _razorpay: Razorpay | null = null;

export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    if (!_razorpay) {
      _razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
    }
    return (_razorpay as any)[prop];
  },
});
