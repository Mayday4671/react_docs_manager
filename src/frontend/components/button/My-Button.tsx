/**
 * @file My-Button.tsx
 * @description 通用按钮封装组件，基于 Ant Design Button 二次封装
 * @module 公共组件
 */

import { Button } from 'antd';

/**
 * MyButton 组件 Props
 */
interface MyButtonProps {
    /** 按钮点击回调 */
    onClick?: () => void;
    /** 展示数据（显示在按钮下方） */
    data?: number;
}

/**
 * 通用按钮组件
 *
 * 封装 Ant Design Button，支持点击回调和数据展示。
 *
 * @param onClick - 按钮点击回调函数
 * @param data - 展示在按钮下方的数字数据
 */
function MyButton({ onClick, data }: MyButtonProps) {
    return (
        <>
            <Button type="primary" onClick={onClick}>第一个按钮</Button>
            <div>{data}</div>
        </>
    );
}

export default MyButton;