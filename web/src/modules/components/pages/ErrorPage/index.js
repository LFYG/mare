import React from 'react';
import PropTypes from 'prop-types';
import postal from 'postal';
import style from './index.scss';

export default class ErrorPage extends React.Component {

    static propTypes = {
        error: PropTypes.object,
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        postal.pub('document-title', 'Error');
    }

    render() {
        const error = Object.assign({
            title: 'Error',
            message: '404 page not found',
        }, this.props.error);

        return (
            <div className={style.root}>
                <p><strong>{error.title}</strong></p>
                <p>{error.message}</p>
                <p className={style.links}>
                    <a href='/'>首页</a>
                    <a href='javascript: history.back();'>后退</a>
                </p>
            </div>
        );
    }

}
