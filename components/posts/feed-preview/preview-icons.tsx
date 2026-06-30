import type { SVGProps } from "react"

// Ported from bluumly @/icons/* — exact paths preserved.

export function FacebookCommentIcon({ width = 18, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 18 16" fill="none" {...props}>
      <path
        d="M9.16667 5.33333H5.16667M11.8333 8H5.16667M14.5 10C14.5 10.3536 14.3595 10.6928 14.1095 10.9428C13.8594 11.1929 13.5203 11.3333 13.1667 11.3333H5.16667L2.5 14V3.33333C2.5 2.97971 2.64048 2.64057 2.89052 2.39052C3.14057 2.14048 3.47971 2 3.83333 2H13.1667C13.5203 2 13.8594 2.14048 14.1095 2.39052C14.3595 2.64057 14.5 2.97971 14.5 3.33333V10Z"
        stroke="#71717A"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FacebookShareIcon({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 20 21" fill="none" {...props}>
      <path
        d="M19 8.00371L12.2838 1V5.02223C6.05404 5.05035 1 10.3102 1 16.8076C1 17.9186 1.16215 18.9874 1.43242 20C2.77026 15.0496 7.1081 11.4212 12.2838 11.4071V14.9933L19 7.98963V8.00371Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InstagramCommentIcon({ width = 19, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 19 18" fill="none" {...props}>
      <path
        d="M2.05609 13.2111C1.03248 11.4841 0.674431 9.4429 1.04917 7.47063C1.4239 5.49836 2.50565 3.73069 4.09133 2.49947C5.67701 1.26825 7.65758 0.658157 9.6612 0.783724C11.6648 0.909292 13.5537 1.76188 14.9733 3.18144C16.3928 4.601 17.2454 6.48989 17.371 8.49352C17.4966 10.4971 16.8865 12.4777 15.6552 14.0634C14.424 15.6491 12.6564 16.7308 10.6841 17.1055C8.71182 17.4803 6.67058 17.1222 4.94359 16.0986L2.09047 16.9064C1.97357 16.9406 1.84963 16.9427 1.73164 16.9126C1.61365 16.8824 1.50595 16.821 1.41983 16.7349C1.33371 16.6488 1.27234 16.5411 1.24216 16.4231C1.21198 16.3051 1.21409 16.1811 1.24828 16.0642L2.05609 13.2111Z"
        stroke="#6B6873"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InstagramShareIcon({ width = 20, height = 19, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 19 20" fill="none" {...props}>
      <path
        d="M17.3833 1.08492L1.36459 5.59663C1.22823 5.63391 1.10668 5.71232 1.01649 5.82118C0.9263 5.93004 0.871862 6.06405 0.860588 6.20497C0.849315 6.34588 0.881755 6.48685 0.953489 6.60866C1.02522 6.73047 1.13276 6.82721 1.26146 6.8857L8.61771 10.3662C8.76181 10.4329 8.87754 10.5486 8.94428 10.6927L12.4247 18.049C12.4832 18.1777 12.58 18.2852 12.7018 18.3569C12.8236 18.4287 12.9646 18.4611 13.1055 18.4498C13.2464 18.4386 13.3804 18.3841 13.4893 18.2939C13.5981 18.2038 13.6765 18.0822 13.7138 17.9459L18.2255 1.9271C18.2597 1.81021 18.2618 1.68627 18.2316 1.56828C18.2015 1.45028 18.1401 1.34258 18.054 1.25646C17.9679 1.17034 17.8602 1.10898 17.7422 1.07879C17.6242 1.04861 17.5002 1.05073 17.3833 1.08492Z"
        stroke="#6B6873"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.84082 10.4698L12.7252 6.58545" stroke="#6B6873" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InstagramBookmarkIcon({ width = 13, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 13 19" fill="none" {...props}>
      <path
        d="M11.5299 17.437L6.19661 13.9588L0.863281 17.437V2.13266C0.863281 1.94817 0.933519 1.77122 1.05854 1.64076C1.18357 1.5103 1.35314 1.43701 1.52995 1.43701H10.8633C11.0401 1.43701 11.2097 1.5103 11.3347 1.64076C11.4597 1.77122 11.5299 1.94817 11.5299 2.13266V17.437Z"
        stroke="#6B6873"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
