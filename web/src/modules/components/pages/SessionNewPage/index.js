import React from 'react';
import SessionForm from 'components/views/SessionForm';
import postal from 'postal';
import sdk from 'sdk';
import {href, redirect} from 'components/router';
import style from './index.scss';

export default class SessionNewPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            alert: null,
            done: false,
        };
    }

    componentDidMount() {
        postal.pub('document-title', 'New Session');
    }

    save = async (value) => {
        const result = await sdk.newSession(value);

        if (result.ok) {
            const url = '/session/';
            const link = <a href={url} onClick={href(url)}>点击转到会话列表</a>;
            const alert = {
                type: 'ok',
                desc: <span>Create session {value.id} success，{link}.</span>,
            };
            this.setState({alert, done: true});
            return;
        }

        if (result.existed) {
            const alert = {
                type: 'error',
                desc: 'Session ID existed',
            };
            this.setState({alert});
            return;
        }

        const alert = {
            type: 'error',
            desc: JSON.stringify(result),
        };
        this.setState({alert});
    }

    onFormSubmit = (value) => {
        this.save(value);
    }

    onFormCancel = () => {
        redirect('/session/');
    }

    render() {
        return (
            <div className={style.root}>
                <div className={`mdl-shadow--2dp ${style.wrap}`}>
                    {do {
                        const alert = this.state.alert;
                        if (alert) {
                            <div className={`alert alert-${alert.type} ${style.alert}`}>
                                <div className='alert-desc'>
                                    {alert.desc}
                                </div>
                            </div>;
                        }
                    }}
                    {do {
                        if (!this.state.done) {
                            <SessionForm
                                onSubmit={this.onFormSubmit}
                                onCancel={this.onFormCancel} />;
                        }
                    }}
                </div>
            </div>
        );
    }

}
