import type {ButtonHTMLAttributes} from 'react';
export function Button({priority,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{priority?:string;size?:string}) {
 const {size,...rest}=props;
 return <button type="button" {...rest} className={`${priority==='secondary'?'secondary ':''}${rest.className??''}`}>{children}</button>;
}
