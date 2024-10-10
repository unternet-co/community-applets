import { appletContext, type AppletContext } from '@web-applets/sdk';
import OpenAI from 'openai';
import { marked } from 'marked';

const wineInput = document.getElementById('wine') as HTMLInputElement;
const descElem = document.getElementById('description') as HTMLDivElement;
type DescribeParams = { wine: string };

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface State {
  wine: string;
  description: string;
}

const applet = appletContext.connect() as AppletContext<State>;

wineInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    describe({ wine: wineInput.value });
  }
});

async function describe({ wine }: DescribeParams) {
  applet.setState({ wine, description: '' });
  const description = await getWineDescription(wine);
  applet.setState({ wine, description });
}

applet.setActionHandler('describe', describe);

applet.onrender = async () => {
  wineInput.value = applet.state.wine;
  descElem.innerHTML = await marked.parse(applet.state.description);
  applet.state.description
    ? descElem.classList.remove('hidden')
    : descElem.classList.add('hidden');
};

async function getWineDescription(wine: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Respond with a brief summary of likely wine traits. Be very brief. Use the categories 'tastes like', 'terroir', & 'pairs with'. Then add a quote (no heading, just a short markdown block quote) for what a smarty pants would say after taking a sip of this wine, to seem intelligent about wines (integrate an interesting fact specific to this wine).
          
          Wine: ${wine}`,
        },
      ],
    });

    console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error:', error);
    return '';
  }
}
