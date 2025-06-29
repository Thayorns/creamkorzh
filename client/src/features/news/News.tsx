import React, { useEffect, useState } from "react";
import { Spin, Empty, Carousel, message, Modal } from 'antd';
import { DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { RootState } from "../../app/store/store";
import { useSelector, useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetOrdersQuery, useDeleteOrderMutation, useAcceptOrderMutation } from "../api/apiSlice";
import { cleanUpSocketState, deleteAllNotificationsOnRouteEnter } from "../api/webSocketSlice";

import './news.css';
import '../../app/styles/normalize.css';
import '../../app/styles/vars.css';

type OrderedArrayRequest = {
    title: string;
    date: string;
    name: string;
    phone: string;
    login: string;
    photo: string;
    count: number;
    time: string;
    isaccepted: boolean;
}

const News: React.FC = () => {

    const dispatch = useDispatch();
    const { login } = useParams<{login: string}>()
    const {data, isLoading, refetch} = useGetOrdersQuery(login);
    const [deleteOrder] = useDeleteOrderMutation();
    const [acceptOrder, {isSuccess: isAccepted, isError: errorAccept}] = useAcceptOrderMutation();
    const [active, setActive] = useState<string | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const showModal = () => {
        setIsModalOpen(true);
    };
    
      const handleCancel = () => {
        setIsModalOpen(false);
    };

    const success = () => {
        messageApi.open({
            type: 'success',
            content: `Order accepted`,
            duration: 5,
        });
    };
    const error = () => {
        messageApi.open({
            type: 'error',
            content: 'Failed to accept the order, an error occurred..',
            duration: 5,
        });
    };
    useEffect(() => {
        if(isAccepted) success();
        if(errorAccept) error();
    }, [isAccepted, errorAccept]);

    const resultArray = data as OrderedArrayRequest[] || [];

    const handleDeleteOrder = async (title: string, name: string) => {
        try{
            await deleteOrder({ title: title, name: name });
            dispatch(cleanUpSocketState({ title: title, name: name }));
            refetch();
        }catch(error){
            console.error('Error deleting order:', error);
        }
    };

    const handleAcceptOrder = async (title: string, name: string) => {
        try{
            await acceptOrder({ title: title, name: name });
            refetch();
        }catch(error){
            console.error('Error confirming order:', error);
        };
    };
    
    useEffect(() => {
        dispatch(deleteAllNotificationsOnRouteEnter());
        refetch();
    },[refetch]);

    const isAuth = useSelector((state: RootState) => state.auth.isAuthenticated);
    const isAdmin = useSelector((state: RootState) => state.auth.role);

    return (
        <div>
            <div className="news-wrapper">
                <div className="news-bg-wrapper">


                    <div className="news-inner">
                        <div className="carousel-wrapper">
                            <Carousel autoplay autoplaySpeed={7000} speed={1000}>
                                <div className="coffee">
                                    <p>every <strong>eighth</strong> coffee is free</p>
                                    <span>for authorized users of the application</span>
                                </div>
                                <div className="bakery">
                                    <p>discount <strong>30%</strong> for yesterday's baking</p>
                                </div>
                                <div className="order-cake">
                                    <p><strong>cake to order</strong></p>
                                    <span>for authorized users of the application</span>
                                </div>
                            </Carousel>
                        </div>

                        {(isLoading) && (<Spin />)}

                        {isAuth === false && (
                            <>
                                <Empty className="empty-basket"/>
                                <span className="empty-news-description">Empty, please sign in.</span>
                            </>
                        )}

                        {(isAdmin === true && isAuth === true) && (
                            resultArray.map((el, index) => (
                                <div key={index} className="news-order-inner">
                                    {contextHolder}
                                    <img src={ process.env.NODE_ENV === 'production' 
                                            ? `${process.env.REACT_APP_PHOTOS_BASE_URL}/${el.photo}` 
                                            : require(`${process.env.REACT_APP_PHOTOS_BASE_URL}/${el.photo}`)
                                        } 
                                        alt=""
                                        onClick={() => setActive(el.title + el.name)}
                                    />
                                    <div className="order-description-admin">
                                        <p><strong>{el.title}</strong> ({el.count} шт.)</p>
                                        <p className="order-in-progress">{el.name}</p>
                                        <p>{el.phone}</p>
                                        <span>на {el.date.split('-').reverse().join('-')}</span>
                                        <span>к {el.time}</span>
                                    </div>
                                    <div className="order-buttons">
                                        {el.isaccepted === true 
                                            ?   <>
                                                <CheckCircleOutlined className="order-accepted"
                                                    style={{ display: active === el.title + el.name ? 'none' : 'inline-block' }}
                                                />
                                                <DeleteOutlined 
                                                    className="order-accepted"
                                                    style={{ display: active === el.title + el.name ? 'inline-block' : 'none' }}
                                                    onClick={() => handleDeleteOrder(el.title, el.name)}
                                                />
                                            </>
                                            :   <>
                                                <CheckCircleOutlined className="accept-order-button" onClick={() => handleAcceptOrder(el.title, el.name)}/>
                                                <DeleteOutlined className="delete-order-button" onClick={showModal}/>
                                                <Modal title="ORDER DELETION" open={isModalOpen} cancelText='cancel' okText='delete'
                                                    onOk={() => {
                                                        handleDeleteOrder(el.title, el.name)
                                                        setIsModalOpen(false);
                                                    }} onCancel={handleCancel}>
                                                    <p>Are you sure you want to delete the order?</p>
                                                </Modal>
                                            </>
                                        }                                        
                                    </div>
                                </div>
                            ))
                        )}

                        {(isAdmin === false && isAuth === true) && (
                            resultArray.map((el, index) => (
                                <div key={index} className="news-order-inner">
                                    <img src={ process.env.NODE_ENV === 'production' 
                                            ? `${process.env.REACT_APP_PHOTOS_BASE_URL}/${el.photo}` 
                                            : require(`${process.env.REACT_APP_PHOTOS_BASE_URL}/${el.photo}`)
                                        } 
                                        alt=""
                                    />
                                    <div className="order-description">
                                        <p>{el.title} ({el.count} pcs.)</p>
                                        <span>{el.date.split('-').reverse().join('-')} at {el.time}</span>
                                        {el.isaccepted === true 
                                            ? <p className="order-in-progress">ORDER ACCEPTED</p>
                                            : <>
                                                <p className="order-in-progress">ORDER IN PROCESSING</p>
                                                <span>Please wait for a call to confirm your order.</span>
                                            </>
                                        }
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
    )
}
export default News;