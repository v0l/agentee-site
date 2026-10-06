import { FormattedMessage } from 'react-intl';
import { useLocalePath } from '../i18n/context';

export function NotFound() {
  const to = useLocalePath();
  return (
    <main id="main">
      <section class="page-head">
        <div class="wrap">
          <p class="eyebrow">[unrouted] 404</p>
          <h1>
            <FormattedMessage defaultMessage="This net goes nowhere" />
          </h1>
          <p class="lede">
            <FormattedMessage defaultMessage="There is no page at this address. It may have moved when the guides were reorganised." />
          </p>
          <div class="cta">
            <a class="pad" href={to('/')}>
              <FormattedMessage defaultMessage="Front page" />
            </a>
            <a class="pad pad-ghost" href={to('/guides/')}>
              <FormattedMessage defaultMessage="Guides" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
