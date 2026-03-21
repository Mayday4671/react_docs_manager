import { Button } from 'antd';


interface MyButtonProps {
    onClick?: () => void,
    data?: number
}

function MyButton({onClick, data}: MyButtonProps) {
    return (
        <>
            <Button type="primary" onClick={onClick}>第一个按钮</Button>
            <div>{data}</div>
        </>
    );
}

export default MyButton;