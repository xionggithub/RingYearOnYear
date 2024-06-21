import './App.scss';
import {dashboard, DashboardState, bitable, IDataCondition} from "@lark-base-open/js-sdk";
import './locales/i18n';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import { useTheme } from './hooks';
import classnames from 'classnames'
import MainContent from './components/MainContent';
import MainConfigPanel from './components/MainConfigPanel';
import { useState, useEffect, useRef } from 'react';
import type { IRenderData } from '@/common/type';
import { dataConditionFormatter, getConfig, getPreviewData, renderMainContentData } from './utils';
import Icon, {IconDeleteStroked, IconPlus} from '@douyinfe/semi-icons';
import IconLoading from './assets/icon_loading.svg?react';
import {ICustomConfig} from "@/common/type";
import {defaultConfig} from "@/common/constant";

export default function App() {
    useTheme();

    /** 是否配置/创建模式下 */
    const isConfig = dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create;
    const [isLoading, setIsLoading] = useState(true)
    const [theme, setTheme] = useState('light')
    const [config, setConfig] = useState<ICustomConfig>(defaultConfig);

    const [renderData, setRenderData] = useState<IRenderData>({
        color: 'primary', // 指标颜色
        value: '', // 指标数据
        prefix: '', // 前缀
        suffix: '', // 前缀
        momYoyList: [], // 同比、环比
    });

    const mainDomRef = useRef<HTMLDivElement>(null);

    const renderMain = async () => {
        const customConfig = await getConfig();
        console.log('render main get config', customConfig)
        setConfig(customConfig)
        if (customConfig.tableId.length > 0) {
            // 读取缓存配置 解析渲染数据
            const value = await getPreviewData(customConfig);
            await renderMainContentData(customConfig, value, setRenderData);
        } else {
            // 保存数据异常则不处理
        }
    }

    // 展示态
    useEffect(() => {
        bitable.bridge.getTheme().then((theme: string) => {
            setTheme(theme)
        })
        if (DashboardState.Create !== dashboard.state) {
            renderMain().then(() => {
                setIsLoading(false)
            });
        } else {
            setIsLoading(false)
        }
        dashboard.onDataChange((data) => {
            if (DashboardState.Create !== dashboard.state) {
                renderMain().then();
            }
        });
        dashboard.onConfigChange((data) => {
            if (DashboardState.Create !== dashboard.state) {
                renderMain().then();
            }
        });
    }, []);

    return isLoading ?
        (<div style={{ width: '100%', height: '100%', display: 'grid', alignItems: 'center', justifyItems: 'center' }}>
            <div style={{ width: 'max-content', height: 'max-content', display: 'flex', flexDirection: 'column', alignItems: 'center', rowGap: '10px', justifyItems: 'center' }}>
                <Icon svg={<IconLoading />} />
                <div style={{textAlign: 'center', fontSize: '16px',  color: theme === 'light' ?  "#1F2329" :  "#FFFFFF" }}>加载中...</div>
            </div>
        </div>) :
        (<main className={classnames(isConfig ? 'top-border' : '', 'main')} ref={mainDomRef}>
            <MainContent renderData={renderData} mainDomRef={mainDomRef} />
            {isConfig && <MainConfigPanel setRenderData={setRenderData}
                                          initializeConfig={config}
            />}
        </main>)
}
