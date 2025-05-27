import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {FetchArgs, FetchBaseQueryError, BaseQueryFn} from '@reduxjs/toolkit/query';
import { RootState } from '../../app/store/store';
import { setToken, logout } from './authSlice';
interface AddUserRequest {
  email: string;
  login: string;
  password: string;
};
interface LogInUserRequest {
  login: string;
  password: string;
};

interface AddQRCodeRequest {
  login: string;
};
interface AddAdminRequest {
  login: string;
};
interface AddFriendRequest {
  login: string;
};

interface CoffeeRequest {
  number: number;
  selectedCoffee: number;
};

interface ProductTitleRequest{
  title: string;
};

interface BuyProductRequest{
  title: string;
  date: string;
  name: string;
  phone: string;
  login: string;
  photo: string;
  count: number;
  time: string;
};

interface DeleteOrderRequest{
  title: string;
  name: string;
};

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.log('SENDING NEW ACCESS-TOKEN');

    try {
      const refreshResult = await baseQuery({
        url: `/api/refresh-token`,
        method: "POST",
        credentials: 'include',
      }, api, extraOptions);

      if (refreshResult.data) {
        api.dispatch(setToken( { accessToken: refreshResult.data as string} ));
        console.log(`GETTING NEW ACCESS-TOKEN ${refreshResult.data}`);
        result = await baseQuery(args, api, extraOptions);

        }else{
          api.dispatch(logout())
          }

    } catch(err) {
      console.error('Ошибка доступа', err)
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder: any) => ({

    // подтвердить заказ клиента админом
    acceptOrder: builder.mutation({
      query: (body: DeleteOrderRequest) => ({
        url: `/api/news`,
        method: 'POST',
        body
      })
    }),

    // удалить заказ админом
    deleteOrder: builder.mutation({
      query: (body: DeleteOrderRequest) => ({
        url: `/api/news`,
        method: 'DELETE',
        body
      })
    }),

    // удаление продукта админом
    deleteProduct: builder.mutation({
      query: (title: string) => ({
        url: `/api/home`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })//без него не удаляет и ошибка json формата
      })
    }),

    // получение заказов клиентом\админом
    getOrders: builder.query({
      query: (login: string) => `/api/news/${login}`
    }),

    // добавление заказа пользователем
    buyProduct: builder.mutation({
      query: (body: BuyProductRequest) => ({
        url: `/api/shop`,
        method: 'POST',
        body
      })
    }),

    // добавление новых продуктов
    addProduct: builder.mutation({
      query: (formData: FormData) => ({
        url: `/api/admin-settings/add-product`,
        method: 'POST',
        body: formData,
      })
    }),

    // добавление нового админа
    addAdmin: builder.mutation({
      query: (body: AddAdminRequest) => ({
        url: `/api/admin-settings/add-admin`,
        method: 'POST',
        body,
      })
    }),

    // добавление пользователя в друзья
    addFriend: builder.mutation({
      query: (body: AddFriendRequest) => ({
        url: `/api/admin-settings/add-friend`,
        method: 'POST',
        body,
      })
    }),

    // получение всех продуктов из бд
    getProducts: builder.query({
      query: () => `/api/home`,
    }),

    // получение отдельного продукта пользователем
    getProduct: builder.query({
      query: (productTitle: ProductTitleRequest) => `/api/home/${productTitle}`,
    }),

    // добавление кофе администратором
    addCoffee: builder.mutation({
      query: (body: CoffeeRequest) => ({
        url: `/api/admin-coffee`,
        method: 'POST',
        body,
      })
    }),

    // обновление кофе пользователем
    getCoffee: builder.query({
      query: (login: string) => `/api/user-coffee/${login}`,
    }),

    // генерация QR-кода пользователем и добавление в бд
    addQRcode: builder.mutation({
      query: (body: AddQRCodeRequest) => ({
        url: `/api/qr`,
        method: 'POST',
        body,
      }),
    }),

    // добавление нового юзера
    addUser: builder.mutation({
      query: (body: AddUserRequest) => ({
        url: `/api/register`,
        method: 'POST',
        body,
      })
    }),

    // получение токена юзером
    getToken: builder.query({
      query: (token: string) => `/api/activate/${token}`
    }),

    // вход в аккаунт юзером
    logInUser: builder.mutation({
      query: (body: LogInUserRequest) => ({
        url: `/api/login`,
        method: 'POST',
        body,
      })
    }),

    // выход из аккаунта юзером
    userLogout: builder.mutation({
      query: () => ({
        url: `/api/logout`,
        method: 'POST'
      }),
    })
  }),
})
export const {useAddUserMutation,
  useGetTokenQuery,
  useLogInUserMutation,
  useUserLogoutMutation,
  useAddQRcodeMutation,
  useAddCoffeeMutation,
  useGetCoffeeQuery,
  useAddProductMutation,
  useGetProductsQuery,
  useDeleteProductMutation,
  useGetProductQuery,
  useAddAdminMutation,
  useAddFriendMutation,
  useBuyProductMutation,
  useGetOrdersQuery,
  useDeleteOrderMutation,
  useAcceptOrderMutation
} = apiSlice;
