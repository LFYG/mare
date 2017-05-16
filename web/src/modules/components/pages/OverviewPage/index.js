import React from 'react';
import postal from 'postal';
import OverviewTable from 'components/widgets/OverviewTable';
import style from './index.scss';

export default class OverviewPage extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        postal.pub('document-title', 'Overview');
    }

    render() {
        return (
            <div className={style.root}>
                <OverviewTable />
            </div>
        );
    }

}
