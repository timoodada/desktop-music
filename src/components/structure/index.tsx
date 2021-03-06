import React, { CSSProperties, FC, ReactNode } from 'react';
import './style.scss';
import { combineClassNames } from '../../helpers/utils';

interface Props {
  header?: ReactNode;
  slider?: ReactNode;
  footer?: ReactNode;
  extra?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
}

const Structure: FC<Props> = (props) => {
  const {
    children,
    header,
    slider,
    footer,
    extra,
    className,
    contentClassName,
    style
  } = props;

  return (
    <section className={combineClassNames(className, 'structure')} style={style}>
      {
        header ?
          <header>{ header }</header> :
          null
      }
      <section className={combineClassNames('content-middle', contentClassName)}>
        {
          slider ?
            <aside>{ slider }</aside> :
            null
        }
        <main className={'content-main'}>{ children }</main>
      </section>
      { extra }
      <footer>{ footer }</footer>
    </section>
  );
};

export { Structure };
